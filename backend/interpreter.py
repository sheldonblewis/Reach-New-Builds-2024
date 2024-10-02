import os

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))



def interpret_image_location(image_url):

    # Make the API call
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "what is the name of this art piece and artist in toronto? only give in this format: `installation_name by artist`"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url,
                        },
                    },
                ],
            }
        ],
        max_tokens=300,
    )
    response = response.choices[0].message.content
    return response

# Example usage
if __name__ == "__main__":
    image_url = "https://gsizkkqfipyplvfqhqeb.supabase.co/storage/v1/object/public/user_uploads/statue_toronto.jpg"
    location_description = interpret_image_location(image_url)
    print(f"Interpreted location: {location_description}")

