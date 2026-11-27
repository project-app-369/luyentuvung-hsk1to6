"""Create small, content-addressed lesson packs for the web build."""
import hashlib
import json


def json_text(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def pack_lessons(course, supplements):
    assets = {}

    def pack(prefix, entries):
        payload = json_text(entries).encode()
        name = f'assets/{prefix}-{hashlib.sha256(payload).hexdigest()[:16]}.json'
        assets[name] = payload
        return name

    strokes = supplements['graphics'] | course['graphics']
    stroke_index = {}
    characters = sorted(strokes)
    for start in range(0, len(characters), 96):
        group = {char: strokes[char] for char in characters[start:start + 96]}
        url = pack('strokes', group)
        for char, record in group.items():
            stroke_index[char] = {'_url': url, 'count': len(record['strokes'])}

    words = course['words']
    lean_words = []
    for start in range(0, len(words), 128):
        group = words[start:start + 128]
        url = pack('examples', {word['id']: word['examples'] for word in group})
        lean_words.extend(dict(word, examples=word['examples'][:1], examplePack=url) for word in group)

    return dict(course, words=lean_words, graphics=stroke_index), dict(supplements, graphics={}), assets
