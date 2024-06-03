import random

from .const import RANDOM_ADJECTIVES, RANDOM_NOUNS


def random_name_generator():
    return f"{random.choice(RANDOM_ADJECTIVES)} {random.choice(RANDOM_NOUNS)}"
