import cohere
import os
import dotenv

dotenv.load_dotenv()

def get_art_installation_info(city, installation_name, artist, conversation_id):
    system_message = f"Give key insights about the art installations  of {installation_name} by {artist} explaining the art work, artist background, Interpretation, and Location background"

    co = cohere.Client(api_key=os.environ.get("COHERE_API_KEY"))
    res = co.chat(
        model="command-light-nightly",
        connectors=[{"id": "web-search"}],
        message=f"{system_message}.",
        conversation_id=conversation_id,
        )


    content = res.text
    generation_id = res.generation_id
    return content, generation_id


def stream_art_installation_info(city, installation_name, artist):
    system_message = f"Give key insights about the art installations with the title and artist, Description, artist background, Interpretation, and Location"

    co = cohere.Client(api_key=os.environ.get("COHERE_API_KEY"))
    res = co.chat_stream(
        model="command-light-nightly",
        connectors=[{"id": "web-search"}],
        message=f"{system_message}. Now tell me about the art installation of {installation_name} by {artist}",
    )

    for event in res:
        if event.event_type == "text-generation":
            yield event.text

def ask_qn(question, conversation_id):
    system_message = f"Answer the question based on the art installation info and keep it to one or two sentences"

    co = cohere.Client(api_key=os.environ.get("COHERE_API_KEY"))
    res = co.chat(
        model="command-light",
        connectors=[{"id": "web-search"}],
        message=f"{system_message}. {question}",
        conversation_id=conversation_id,
    )
    print(res.text)
    return res.text

def main():
    city = "Toronto"
    installation_name = "Dreaming"
    artist = "Jaume Plensa"

    content = get_art_installation_info(city, installation_name, artist, "87b733b8-af0e-47b5-95d5-caafc791b186")
    print(content)
    qn = ask_qn("What is the artist background?", "87b733b8-af0e-47b5-95d5-caafc791b186")
    #split off by \n\n
    print(qn)


if __name__ == "__main__":
    main()

