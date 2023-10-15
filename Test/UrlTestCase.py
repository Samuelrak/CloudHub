from django.test import TestCase
from django.urls import reverse

class ViewsTestCase(TestCase):
    def test_user_registration_view(self):
        response = self.client.get(reverse('user-registration'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "User Registration View")

    def test_user_login_view(self):
        response = self.client.get(reverse('user-login'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "User Login View")

    def test_user_logout_view(self):
        response = self.client.get(reverse('user-logout'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "User Logout View")

    def test_folder_list_view(self):
        # Assuming you have set up a URL named 'folder-list'
        response = self.client.get(reverse('folder-list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Folder List View")

    def test_folder_create_view(self):
        # Assuming you have set up a URL named 'folder-create'
        response = self.client.get(reverse('folder-create'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Folder Create View")

    def test_file_list_view(self):
        # Assuming you have set up a URL named 'file-list'
        response = self.client.get(reverse('file-list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "File List View")

    def test_file_upload_view(self):
        # Assuming you have set up a URL named 'file-upload'
        response = self.client.get(reverse('file-upload'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "File Upload View")

    def test_file_download_view(self):
        # Assuming you have set up a URL named 'file-download' with a file_id parameter
        response = self.client.get(reverse('file-download', kwargs={'file_id': 1}))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "File Download View for File ID: 1")