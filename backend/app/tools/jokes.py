import random
from typing import Any

JOKES: tuple[tuple[str, str], ...] = (
    ("Why do programmers prefer dark mode?", "Because light attracts bugs."),
    ("Why did the scarecrow win an award?", "He was outstanding in his field."),
    ("What do you call fake spaghetti?", "An impasta."),
    ("Why don't skeletons fight each other?", "They don't have the guts."),
    ("Why did the math book look sad?", "It had too many problems."),
    ("What do you call a bear with no teeth?", "A gummy bear."),
    ("Why can't you trust atoms?", "They make up everything."),
    ("What did the ocean say to the beach?", "Nothing, it just waved."),
    ("Why did the bicycle fall over?", "It was two tired."),
    ("What is a computer's favourite snack?", "Microchips."),
    ("Why was the JavaScript developer sad?", "Because he didn't Node how to Express himself."),
    ("How does a penguin build its house?", "Igloos it together."),
    ("Why did the tomato turn red?", "It saw the salad dressing."),
    ("What do you call cheese that isn't yours?", "Nacho cheese."),
    ("Why do bees have sticky hair?", "Because they use honeycombs."),
    ("What do you call a sleeping bull?", "A bulldozer."),
    ("Why did the coffee file a police report?", "It got mugged."),
    ("What kind of music do mummies listen to?", "Wrap."),
    ("Why did the golfer bring two pairs of pants?", "In case he got a hole in one."),
    ("What do you call a fish wearing a bowtie?", "Sofishticated."),
    ("Why was the cell phone wearing glasses?", "It lost its contacts."),
    ("How do you organize a space party?", "You planet."),
    ("What did one wall say to the other?", "I'll meet you at the corner."),
    ("Why don't eggs tell jokes?", "They'd crack each other up."),
    ("What do you call a lazy kangaroo?", "A pouch potato."),
    ("Why did the web developer leave the restaurant?", "Because of the table layout."),
)


def pick(exclude: int) -> dict[str, Any]:
    size = len(JOKES)
    if 0 <= exclude < size:
        index = random.randrange(size - 1)
        if index >= exclude:
            index += 1
    else:
        index = random.randrange(size)
    setup, punchline = JOKES[index]
    return {"id": index, "setup": setup, "punchline": punchline}