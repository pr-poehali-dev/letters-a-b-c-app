import json
import os
import boto3
from botocore.exceptions import ClientError

AUDIO_KEYS = ['a', 'b', 'v', 'petuh', 'banan', 'lastochka']
IMAGE_KEYS = ['petuh', 'banan', 'lastochka']
IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp']

def handler(event: dict, context) -> dict:
    """Возвращает наличие аудио и картинок (true/false для каждого ключа)."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    audio = {}
    for key in AUDIO_KEYS:
        try:
            s3.head_object(Bucket='files', Key=f'audio/{key}.mp3')
            audio[key] = True
        except ClientError:
            audio[key] = False

    images = {}
    for key in IMAGE_KEYS:
        found = False
        for ext in IMAGE_EXTS:
            try:
                s3.head_object(Bucket='files', Key=f'images/{key}.{ext}')
                found = True
                break
            except ClientError:
                continue
        images[key] = found

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
        },
        'body': json.dumps({'audio': audio, 'images': images})
    }
