<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OpenAI API Key
    |--------------------------------------------------------------------------
    |
    | Your OpenAI API key. You can find this in your OpenAI dashboard.
    |
    */
    'api_key' => env('OPENAI_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI Organization
    |--------------------------------------------------------------------------
    |
    | Your OpenAI organization ID. This is optional.
    |
    */
    'organization' => env('OPENAI_ORGANIZATION'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI Base URL
    |--------------------------------------------------------------------------
    |
    | The base URL for the OpenAI API. This is optional and defaults to the
    | official OpenAI API URL.
    |
    */
    'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI HTTP Client
    |--------------------------------------------------------------------------
    |
    | The HTTP client to use for making requests to the OpenAI API. This is
    | optional and defaults to the Laravel HTTP client.
    |
    */
    'http_client' => null,

    /*
    |--------------------------------------------------------------------------
    | OpenAI Request Timeout
    |--------------------------------------------------------------------------
    |
    | The timeout for requests to the OpenAI API in seconds. This is optional
    | and defaults to 30 seconds.
    |
    */
    'request_timeout' => env('OPENAI_REQUEST_TIMEOUT', 30),
]; 