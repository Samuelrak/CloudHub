from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


from django.http import JsonResponse

def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            # Authentication successful
            return JsonResponse({'success': True})
        else:
            # Authentication failed
            return JsonResponse({'error': 'Authentication failed. Please check your credentials.'})
    return JsonResponse({'error': 'Invalid request method'}, status=400)


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')  # Redirect to a dashboard page
    else:
        form = UserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

def user_login1():
 print("ds")

from django.contrib.auth import authenticate, login
from django.http import JsonResponse

from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.http import HttpResponse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from .Models import User

@csrf_exempt
def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        # Check if the user exists in the "users" table
        user = User.objects.filter(username=username, password=password).first()

        if user is not None:
            # Authentication successful
            login(request, user)
            return JsonResponse({'message': 'Login successful'})
        else:
            # Authentication failed
            return JsonResponse({'error': 'Invalid credentials'}, status=401)


def my_template_view(request):
    return render(request, 'index.html')

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

class FolderDeleteView(LoginRequiredMixin, View):
    def post(self, request, folder_id):
        # Implement folder deletion logic here
        return HttpResponse("Folder deleted successfully")

class GenerateShareableLinkView(LoginRequiredMixin, View):
    def post(self, request, file_id):
        # Implement shareable link generation logic here
        return HttpResponse("Shareable link generated successfully")

