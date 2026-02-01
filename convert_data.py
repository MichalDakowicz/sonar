import json
import os

input_path = r"c:\music-tracker\vinyl-cd-tracker-data.json"
output_path = r"c:\music-tracker\converted_data.json"


def convert():
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    converted = []

    for i, item in enumerate(data):
        # Status
        status = "Wishlist" if item.get("wanted") else "Collection"

        # Formats
        # Map common keys to capitalized format names
        types = item.get("types", {})
        formats = []
        # Check standard keys
        if types.get("vinyl"):
            formats.append("Vinyl")
        if types.get("cd"):
            formats.append("CD")
        if types.get("cassette"):
            formats.append("Cassette")
        if types.get("digital"):
            formats.append("Digital")

        # Default format if none found
        if not formats and types:
            # Try to guess from keys if they are true
            for k, v in types.items():
                if v and k.capitalize() not in formats:
                    formats.append(k.capitalize())

        if not formats:
            formats = ["Digital"]

        # Artist
        # Ensure it's an array
        raw_artists = item.get("albumArtists", [])
        if isinstance(raw_artists, str):
            artists = [raw_artists]
        else:
            artists = raw_artists

        # Timestamp
        # Convert float ID to int timestamp if possible, else current time
        raw_id = item.get("id")
        try:
            added_at = int(float(raw_id))
        except:
            added_at = 0  # Will be fixed by import if 0 or just old

        # Construct new object
        new_item = {
            "title": item.get("albumName"),
            "artist": artists,
            "coverUrl": item.get("imageUrl"),
            "releaseDate": item.get("releaseDate"),
            "url": item.get("albumLink"),
            "format": formats,
            "status": status,
            "rating": 0,
            "addedAt": added_at,
            "customOrder": i,  # Preserve array order
            "genres": item.get("genres", []),
        }

        # Clean up None/Empty values
        if not new_item["url"]:
            del new_item["url"]
        if not new_item["coverUrl"]:
            del new_item["coverUrl"]
        if not new_item["releaseDate"]:
            del new_item["releaseDate"]

        converted.append(new_item)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(converted, f, indent=2)

    wishlist_count = sum(1 for i in converted if i["status"] == "Wishlist")
    print(f"Successfully converted {len(converted)} items to {output_path}")
    print(f"  - Collection: {len(converted) - wishlist_count}")
    print(f"  - Wishlist: {wishlist_count}")


if __name__ == "__main__":
    convert()
