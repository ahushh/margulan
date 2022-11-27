import weaviate
import json

client = weaviate.Client("https://test-margulan.semi.network/")

# delete all classes
client.schema.delete_all()