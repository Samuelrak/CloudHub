from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from .models import File, Folder, ShareableLink

def file_list(request):
    files = File.objects.filter(user=request.user)
    return render(request, 'file_list.html', {'files': files})

def file_detail(request, file_id):
    file = get_object_or_404(File, id=file_id, user=request.user)
    return render(request, 'file_detail.html', {'file': file})

@csrf_exempt
def file_upload(request):
    if request.method == 'POST':
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def file_download(request, file_id):
    file_object = get_object_or_404(File, id=file_id, user=request.user)
    file_path = file_object.path
    with open(file_path, 'rb') as file:
        response = FileResponse(file)
        # Set content disposition to force download
        response['Content-Disposition'] = f'attachment; filename="{file_object.filename}"'
        return response
def file_delete(request, file_id):
    file_object = get_object_or_404(File, id=file_id, user=request.user)

    file_object.delete()



    return JsonResponse({'status': 'success', 'message': 'File deleted successfully'})

def folder_list(request):
    folders = Folder.objects.filter(user=request.user)
    return render(request, 'folder_list.html', {'folders': folders})

def folder_detail(request, folder_id):
    folder = get_object_or_404(Folder, id=folder_id, user=request.user)
    return render(request, 'folder_detail.html', {'folder': folder})

@csrf_exempt
def folder_create(request):
    if request.method == 'POST':
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def folder_delete(request, folder_id):

    pass

def generate_shareable_link(request, file_id):

    pass

def search_files(request):

    pass