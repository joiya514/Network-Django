from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
import json
from django.core.paginator import Paginator

from .models import User, Follower, Post, Like


def index(request):
    return render(request, "network/index.html")


@login_required
def new_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    data = json.loads(request.body)
    post_text = data.get("text", "").strip()
    if not post_text:
        return JsonResponse({"error": "Post text cannot be empty."}, status=400)
    post = Post.objects.create(user=request.user, text=post_text)
    post.save()

    return JsonResponse({"message": "Post created successfully!"}, status=201)


def get_post(request, post_id):
    print(post_id)
    post = Post.objects.get(pk=post_id)
    return JsonResponse(post.serialize())


def like_post(request, post_id):
    post = Post.objects.get(pk=post_id)
    if request.user.is_authenticated: 
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()

        return JsonResponse({
            "likes_count": post.likes.count(),
            "likes_count": post.likes.count(),
            "liked": post.likes.filter(user=request.user).exists() if request.user.is_authenticated else False
            })
    return JsonResponse({"error": "Post not found"}, status=404)

def follow(request, user_id):
    user = User.objects.get(pk=user_id)
    follower, created = Follower.objects.get_or_create(user=user, follower=request.user)
    if request.user.is_authenticated:
        if not created:
            follower.delete()
        return JsonResponse({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                },
            "followers": user.followers.count(),
            "followed": created if request.user.is_authenticated else False
            })
    return JsonResponse({"error": "Post not found"}, status=404)


from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def get_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        
        if request.method == "GET":
            return JsonResponse(post.serialize(), safe=False)

        elif request.method == "PUT":
            data = json.loads(request.body)
            print(data)
            if request.user == post.user: 
                post.text = data["text"]
                post.save()
                return JsonResponse(post.serialize(), safe=False)
            else:
                return JsonResponse({"error": "Unauthorized"}, status=403)

    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)


def load_posts(request, posts, user_id=None):
    
    print(f"Posts called {posts}")
    if posts.lower() == 'all posts':
        posts = Post.objects.all()
        
    elif posts.lower() == 'following':
        user = request.user
        following = Follower.objects.filter(follower=user).values_list("user")
        posts = Post.objects.filter(user__in=following)

    elif posts.lower() == 'profile posts':
        posts = Post.objects.filter(user= User.objects.get(pk=user_id))

    page_number = int(request.GET.get("page", 1))
    posts = posts.order_by("-timestamp")
    # Paginate posts
    paginator = Paginator(posts, 10)
    page_obj = paginator.get_page(page_number)

    return JsonResponse({
        "posts": [post.serialize(user=request.user) if request.user.is_authenticated else post.serialize() for post in page_obj.object_list],
        "page": page_obj.number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "current_user": request.user.username
    }, safe=False)

def profile_posts(request, user):
    posts = Post.objects.filter(user=user).order_by("-timestamp")
    return JsonResponse([post.serialize() for post in posts], safe=False)

def profile(request, user_id):
    user = User.objects.get(pk=user_id)
    followers = Follower.objects.filter(user=user).select_related("follower")
    following = Follower.objects.filter(follower=user).select_related("user")
    posts = Post.objects.filter(user=user).order_by("-timestamp")
    likes_count = Like.objects.filter(post__in=posts).count()

    return JsonResponse({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
        "followers":{
            "count": followers.count(),
            "data": [
            {"id": f.follower.id, "username": f.follower.username} for f in followers
        ]},
        "following": {
            "count": following.count(),
            "data": [
            {"id": f.user.id, "username": f.user.username} for f in following
        ]},
        "posts": [
            {"id": p.id, "text": p.text, "timestamp": p.timestamp} for p in posts
        ],
        "likes": likes_count,
        "current_user": request.user.username if request.user.is_authenticated else None,
        "is_following": followers.filter(follower=request.user).exists() if request.user.is_authenticated else False
    }, safe=False)



def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def followers(request, user_id):
    user = User.objects.get(pk=user_id)
    followers = Follower.objects.filter(user=user).select_related("follower")

    followers_data = []
    for follower in followers:
        follower_data = {
            "follower": {
                "username": follower.follower.username,
                "id": follower.follower.id,
            },
            "followers_count": Follower.objects.filter(user=follower.follower).count(),
            "following_count": Follower.objects.filter(follower=follower.follower).count(),
        }
        followers_data.append(follower_data)

    return JsonResponse({
        "user": {
            "username": user.username,
            "id": user.id
            },
        "followers": followers_data
    })

def following(request, user_id):
    user = User.objects.get(pk=user_id)
    following = Follower.objects.filter(follower=user).select_related("user")

    following_data = []
    for f in following:
        follower_data = {
            "following": {
                "username": f.user.username,
                "id": f.user.id,
            },
            "followers_count": Follower.objects.filter(user=f.follower).count(),
            "following_count": Follower.objects.filter(follower=f.follower).count(),
        }
        following_data.append(follower_data)

    return JsonResponse({
        "user": user.username,
        "following": following_data
    })