# main1.py

class MainClass1:
    def __init__(self, name):
        self.name = name

    def print_name(self):
        print("Name from MainClass1:", self.name)

def main_function1():
    print("This is a function from MainClass1 in main1.py")

if __name__ == "__main__":
    # This code block will be executed if main1.py is run directly
    main_instance1 = MainClass1("John")
    main_instance1.print_name()