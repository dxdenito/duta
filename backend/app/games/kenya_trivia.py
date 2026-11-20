def q(text: str, correct: str, *wrong: str) -> dict[str, object]:
    return {"text": text, "correct": correct, "wrong": list(wrong)}


KENYA: tuple[dict[str, object], ...] = (
    q("What is the capital city of Kenya?", "Nairobi", "Mombasa", "Kisumu", "Nakuru"),
    q("What is the highest mountain in Kenya?", "Mount Kenya", "Mount Elgon", "Mount Longonot", "Mount Kilimanjaro"),
    q("In which year did Kenya gain independence?", "1963", "1957", "1960", "1967"),
    q("Which lake does Kenya share with Uganda and Tanzania?", "Lake Victoria", "Lake Turkana", "Lake Naivasha", "Lake Baringo"),
    q("Who was the first president of Kenya?", "Jomo Kenyatta", "Daniel arap Moi", "Mwai Kibaki", "Tom Mboya"),
    q("Which Kenyan national park is famous for the annual wildebeest migration?", "Maasai Mara", "Amboseli", "Tsavo East", "Nairobi National Park"),
    q("Which city is the main seaport of Kenya?", "Mombasa", "Kisumu", "Malindi", "Eldoret"),
    q("Through which Kenyan town does the equator pass?", "Nanyuki", "Mombasa", "Garissa", "Lodwar"),
    q("What is the currency of Kenya?", "Kenyan shilling", "Kenyan franc", "Kenyan dollar", "Kenyan birr"),
    q("Which Kenyan lake is especially famous for its flamingos?", "Lake Nakuru", "Lake Victoria", "Lake Turkana", "Lake Naivasha"),
    q("Who won the Nobel Peace Prize in 2004, becoming the first African woman to do so?", "Wangari Maathai", "Ellen Johnson Sirleaf", "Leymah Gbowee", "Graça Machel"),
    q("Which lake is the largest permanent desert lake in the world?", "Lake Turkana", "Lake Victoria", "Lake Baringo", "Lake Naivasha"),
    q("What is a matatu in Kenya?", "A minibus used for public transport", "A traditional Maasai dance", "A local sweet drink", "A type of market stall"),
    q("Which Kenyan was the first person to run a marathon distance in under two hours, in an unofficial 2019 event?", "Eliud Kipchoge", "David Rudisha", "Paul Tergat", "Wilson Kipsang"),
    q("Which colour is NOT on the Kenyan flag?", "Yellow", "Black", "Red", "Green"),
    q('What does the Swahili phrase "hakuna matata" mean?', "No worries", "Welcome home", "Thank you very much", "See you later"),
    q("How many counties does Kenya have?", "47", "42", "50", "8"),
    q("Which ocean borders the coast of Kenya?", "Indian Ocean", "Atlantic Ocean", "Pacific Ocean", "Arctic Ocean"),
    q("Which is the second largest city in Kenya?", "Mombasa", "Kisumu", "Nakuru", "Eldoret"),
    q("Which language is Kenya's national language, alongside English as an official language?", "Kiswahili", "Amharic", "Zulu", "Hausa"),
    q("Which mountain, visible from Amboseli National Park, lies across the border in Tanzania?", "Mount Kilimanjaro", "Mount Kenya", "Mount Elgon", "Mount Longonot"),
    q('Which Kenyan city is nicknamed the "Green City in the Sun"?', "Nairobi", "Mombasa", "Kisumu", "Nakuru"),
    q("What is the name of the Kenyan national football team?", "Harambee Stars", "Black Stars", "Super Eagles", "Indomitable Lions"),
    q('What does the national motto "Harambee" mean?', "Let us all pull together", "Freedom and unity", "Peace and love", "Strength in numbers"),
    q("Which is the largest national park in Kenya?", "Tsavo East", "Amboseli", "Nairobi National Park", "Lake Nakuru National Park"),
)