from fastapi import FastAPI, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from interpreter import interpret_image_location
import os
import cohere
from dotenv import load_dotenv

from coresearch import get_art_installation_info, stream_art_installation_info, ask_qn


load_dotenv()

app = FastAPI()

@app.get('/')
def root():
    return {"message": "Hello World"}

@app.get('/sample_art_info')
def sample_art_info():
    image_url = "https://gsizkkqfipyplvfqhqeb.supabase.co/storage/v1/object/public/user_uploads/statue_toronto.jpg"
    location_description = interpret_image_location(image_url)
    print(f"Interpreted location: {location_description}")
    name, artist = location_description.split(" by ")
    info = get_art_installation_info(city="Toronto", installation_name=name, artist=artist, conversation_id="123")
    return {"info": info}

# @app.get('/stream_art_info')
# def stream_art_info(city: str, installation_name: str, artist: str):
#     def event_generator():
#         for text in stream_art_installation_info(city, installation_name, artist):
#             yield text

#     return StreamingResponse(event_generator(), media_type="text/plain")

@app.get('/art_info')
def art_info(image_url: str = Query(...), city: str = Query(...), conversation_id: str = Query(...)):
    location_description = interpret_image_location(image_url).replace("`", "")
    print(f"Interpreted location: {location_description}")
    name, artist = location_description.split(" by ")
    info, generation_id = get_art_installation_info(city=city, installation_name=name, artist=artist, conversation_id=conversation_id)
    return {"city": city, "installation_name": name, "artist": artist, "info": info, "generation_id": generation_id}


@app.post('/ask_question')
def ask_question( question: str = Query(...), generation_id: str = Query(...)):
    answer = ask_qn(question, generation_id)
    return {"answer": answer}

