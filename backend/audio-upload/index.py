import json
import base64
import os
import boto3

def handler(event: dict, context) -> dict:
    """Загружает аудиофайл MP3 в S3 хранилище и возвращает публичный URL."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    file_key = body.get('key')       # например: "a", "petuh", "banan"
    file_data = body.get('data')     # base64-строка

    if not file_key or not file_data:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не указан key или data'})
        }

    allowed_keys = ['a', 'b', 'v', 'petuh', 'banan', 'lastochka']
    if file_key not in allowed_keys:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Недопустимый ключ. Разрешены: {allowed_keys}'})
        }

    audio_bytes = base64.b64decode(file_data)

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    s3_key = f'audio/{file_key}.mp3'
    s3.put_object(
        Bucket='files',
        Key=s3_key,
        Body=audio_bytes,
        ContentType='audio/mpeg',
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{s3_key}"

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'url': cdn_url, 'key': file_key})
    }