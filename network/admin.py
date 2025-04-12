from django.contrib import admin
from .models import User, Follower, Post, Like
# Register your models here.


admin.site.register(User)
admin.site.register(Follower)
admin.site.register(Post)
admin.site.register(Like)