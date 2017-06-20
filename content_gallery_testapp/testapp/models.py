from django.db import models

from content_gallery.models import ContentGalleryMixin

class Cat(ContentGalleryMixin, models.Model):

    SEX_CHOICES = {
        ('M', "Male"),
        ('F', "Female")
    }

    name = models.CharField(max_length=50)
    age = models.IntegerField(null=True)
    sex = models.CharField(max_length=1, choices=SEX_CHOICES, null=True)
    about = models.TextField(null=True)

    def __str__(self):
        return self.name