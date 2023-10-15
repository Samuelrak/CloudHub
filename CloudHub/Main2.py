from Main import MainClass1, main_function1


class MainClass2:
    def __init__(self, name):
        self.name = name

    def print_name(self):
        print("Name from MainClass2:", self.name)

def main_function2():
    print("This is a function from MainClass2 in main2.py")

if __name__ == "__main__":
    # This code block will be executed if main2.py is run directly
    main_instance2 = MainClass1("Alice")
    main_instance2.print_name()

    # Call functions and classes from main1.py
    main_instance1 = MainClass1("Bob")
    main_instance1.print_name()

    main_function2()