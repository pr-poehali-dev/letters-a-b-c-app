import json
import base64
import os
import boto3

ALLOWED_KEYS = ['petuh', 'banan', 'lastochka']
CONTENT_TYPES = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
}

def handler(event: dict, context) -> dict:
    """Загружает картинку (JPG/PNG) в S3 и возвращает публичный CDN URL."""

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
    file_key = body.get('key')    # petuh / banan / lastochka
    file_data = body.get('data')  # base64
    ext = body.get('ext', 'jpg').lower().strip('.')

    if not file_key or not file_data:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Не указан key или data'})}

    if file_key not in ALLOWED_KEYS:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Допустимые ключи: {ALLOWED_KEYS}'})}

    if ext not in CONTENT_TYPES:
        ext = 'jpg'

    image_bytes = base64.b64decode(file_data)
    content_type = CONTENT_TYPES[ext]

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    s3_key = f'images/{file_key}.{ext}'
    s3.put_object(Bucket='files', Key=s3_key, Body=image_bytes, ContentType=content_type)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{s3_key}"

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'url': cdn_url, 'key': file_key})
    }
