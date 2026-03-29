import os
import base64
import boto3
from botocore.exceptions import ClientError

def handler(event: dict, context) -> dict:
    """Отдаёт аудиофайл MP3 из S3 в base64 для воспроизведения в браузере."""

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

    allowed_keys = ['a', 'b', 'v', 'petuh', 'banan', 'lastochka']
    if key not in allowed_keys:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': 'Invalid key'
        }

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    try:
        response = s3.get_object(Bucket='files', Key=f'audio/{key}.mp3')
        audio_bytes = response['Body'].read()
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'audio/mpeg',
            },
            'body': audio_b64,
            'isBase64Encoded': True
        }
    except ClientError:
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': 'Not found'
        }
