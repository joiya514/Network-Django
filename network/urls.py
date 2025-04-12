
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    #API Routes
    path("posts", views.new_post, name="new_post"),
    path("posts/<str:posts>", views.load_posts, name="load_posts"),
    path("post/<int:post_id>", views.get_post, name="get_post"),
    path("post/<int:post_id>/like", views.like_post, name="get_post"),
    path("posts/<str:posts>/<int:user_id>", views.load_posts, name="load_profile_posts"),
    path("profile/<int:user_id>", views.profile, name="profile"),
    path("followers/<int:user_id>", views.followers, name="followers"),
    path("following/<int:user_id>", views.following, name="following"),
    path("follow/<int:user_id>", views.follow, name="follow"),
]
