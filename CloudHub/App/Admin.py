from django.contrib import admin
from .models import File, Folder, ShareableLink

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('filename', 'user', 'type', 'size', 'created_at', 'updated_at')
    search_fields = ('filename', 'user__username')

@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ('folder_name', 'user', 'created_at', 'updated_at')
    search_fields = ('folder_name', 'user__username')

@admin.register(ShareableLink)
class ShareableLinkAdmin(admin.ModelAdmin):
    list_display = ('user', 'file', 'link_token', 'is_folder', 'expiration_date', 'created_at', 'updated_at')
    search_fields = ('user__username', 'file__filename', 'link_token')