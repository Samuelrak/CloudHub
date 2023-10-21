from django.urls import path
from CloudHub.views import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    FolderListView,
    FolderCreateView,
    FileListView,
    FileUploadView,
    FileDownloadView,
    FolderDeleteView,
    GenerateShareableLinkView,
    my_template_view,
)

urlpatterns = [
    path('frontend/', my_template_view, name='my-template'),
    path('user-registration/', UserRegistrationView.as_view(), name='user-registration'),
    path('user-login/', UserLoginView.as_view(), name='user-login'),
    path('user-logout/', UserLogoutView.as_view(), name='user-logout'),
    path('folder-list/', FolderListView.as_view(), name='folder-list'),
    path('folder-create/', FolderCreateView.as_view(), name='folder-create'),
    path('file-list/', FileListView.as_view(), name='file-list'),
    path('file-upload/', FileUploadView.as_view(), name='file-upload'),
    path('file-download/<int:file_id>/', FileDownloadView.as_view(), name='file-download'),
    path('folder-delete/<int:folder_id>/', FolderDeleteView.as_view(), name='folder-delete'),
    path('generate-shareable-link/<int:file_id>/', GenerateShareableLinkView.as_view(), name='generate-shareable-link'),
]