from interpreter import interpret_image_location
from coresearch import get_art_installation_info

def main():
    image_url = "https://gsizkkqfipyplvfqhqeb.supabase.co/storage/v1/object/public/user_uploads/statue_toronto.jpg"
    location_description = interpret_image_location(image_url)
    print(f"Interpreted location: {location_description}")
    name, artist = location_description.split(" by ")
    info = get_art_installation_info(city="Toronto", installation_name=name, artist=artist, image_url=image_url)
    print(f"Art installation info: {info}")

if __name__ == "__main__":
    main()