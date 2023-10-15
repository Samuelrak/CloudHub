from django.contrib import admin
from django.urls import path
from Url import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    FolderListView,
    FolderCreateView,
    FileListView,
    FileUploadView,
    FileDownloadView,
)

urlpatterns = [
    path('user-registration/', UserRegistrationView.as_view(), name='user-registration'),
    path('user-login/', UserLoginView.as_view(), name='user-login'),
    path('user-logout/', UserLogoutView.as_view(), name='user-logout'),
    path('folder-list/', FolderListView.as_view(), name='folder-list'),
    path('folder-create/', FolderCreateView.as_view(), name='folder-create'),
    path('file-list/', FileListView.as_view(), name='file-list'),
    path('file-upload/', FileUploadView.as_view(), name='file-upload'),
    path('file-download/<int:file_id>/', FileDownloadView.as_view(), name='file-download'),

]

urlpatterns = [
    path('admin/', admin.site.urls),
]