from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Follower(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    followed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "follower")

    def __str__(self):
        return f"{self.user.username} is followed by {self.follower.username}."


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self, user=None):
        return {
            "id": self.id,
            "user": {
                "id": self.user.id,
                "username": self.user.username
            },
            "text": self.text,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "likes_count": self.likes.count(),  # Total likes count
            "liked": self.likes.filter(user=user).exists() if user else False
        }

    def __str__(self):
        return f"{self.user.username} posted: {self.text}"
    

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")

    class Meta:
        unique_together = ("user", "post")

    def __str__(self):
        return f"{self.user.username} liked {self.post.user.username}'s post."