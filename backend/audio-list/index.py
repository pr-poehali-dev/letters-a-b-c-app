import json
import os
import boto3
from botocore.exceptions import ClientError

AUDIO_KEYS = ['a', 'b', 'v', 'petuh', 'banan', 'lastochka']

def handler(event: dict, context) -> dict:
    """Возвращает список загруженных аудиофайлов с их CDN-ссылками."""

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

    result = {}
    for key in AUDIO_KEYS:
        s3_key = f'audio/{key}.mp3'
        try:
            s3.head_object(Bucket='files', Key=s3_key)
            result[key] = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{s3_key}"
        except ClientError:
            result[key] = None

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result)
    }
