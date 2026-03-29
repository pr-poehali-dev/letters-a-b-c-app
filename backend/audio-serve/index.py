import os
import base64
import boto3
from botocore.exceptions import ClientError

AUDIO_KEYS = ['a', 'b', 'v', 'petuh', 'banan', 'lastochka']
IMAGE_KEYS = ['petuh', 'banan', 'lastochka']
IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp']

def handler(event: dict, context) -> dict:
    """Отдаёт аудио MP3 или картинку из S3. type=audio|image, key=имя файла."""

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

    params = event.get('queryStringParameters') or {}
    key = params.get('key', '')
    file_type = params.get('type', 'audio')

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    if file_type == 'image':
        if key not in IMAGE_KEYS:
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'Invalid key'}
        for ext in IMAGE_EXTS:
            s3_key = f'images/{key}.{ext}'
            try:
                response = s3.get_object(Bucket='files', Key=s3_key)
                img_bytes = response['Body'].read()
                content_type = 'image/jpeg' if ext in ('jpg', 'jpeg') else f'image/{ext}'
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': content_type},
                    'body': base64.b64encode(img_bytes).decode('utf-8'),
                    'isBase64Encoded': True
                }
            except ClientError:
                continue
        return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'Not found'}

    else:
        if key not in AUDIO_KEYS:
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'Invalid key'}
        try:
            response = s3.get_object(Bucket='files', Key=f'audio/{key}.mp3')
            audio_bytes = response['Body'].read()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'audio/mpeg'},
                'body': base64.b64encode(audio_bytes).decode('utf-8'),
                'isBase64Encoded': True
            }
        except ClientError:
            return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'Not found'}
