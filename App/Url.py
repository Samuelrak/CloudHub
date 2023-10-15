from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse

class UserRegistrationView(View):
    def get(self, request):
        return HttpResponse("User Registration View")

class UserLoginView(View):
    def get(self, request):
        return HttpResponse("User Login View")

class UserLogoutView(View):
    def get(self, request):
        return HttpResponse("User Logout View")

class FolderListView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("Folder List View")

class FolderCreateView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("Folder Create View")

class FileListView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("File List View")

class FileUploadView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("File Upload View")

class FileDownloadView(LoginRequiredMixin, View):
    def get(self, request, file_id):
        return HttpResponse(f"File Download View for File ID: {file_id}")