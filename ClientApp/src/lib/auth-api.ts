import axios from "axios";
import { apiClient } from "@/lib/apiClient";
const LOGIN_OTP_URL = 'https://api.verifya2z.com/api/v1/login_otp';
const VERIFY_OTP_URL = 'https://api.verifya2z.com/api/v1/login_verify_otp';

export interface LoginOTPResponse
{
    status: boolean;
    message: string;
    statuscode: number;
    data?: {
        mobile?: string;
    };
}

export interface VerifyOTPResponse
{
    status: boolean;
    message: string;
    statuscode: number;
    access_token?: string;
    token_type?: string;
    expires_in?: number;
}


export async function requestLoginOTP(username: string, password: string): Promise<LoginOTPResponse>
{
    try
    {
        const loginDetails = {
            username: username,
            password: password
        };

        
        const formEncodedBody = Object.entries(loginDetails)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        };
        return apiClient.makeRequest<LoginOTPResponse>({
            url: LOGIN_OTP_URL,
            method: 'POST',
            headers: requestHeaders,
            body: formEncodedBody,
            timeout: 30000,
        });
        
;
    } catch (error: any)
    {
        // AxiosError has response/request/message
        const isNetworkOrCORS = !!error.request && !error.response;

        if (isNetworkOrCORS)
        {
            console.warn('Network/CORS issue. Using mock response for development.');
            return {
                status: true,
                message: 'OTP sent successfully (mock)',
                statuscode: 200,
                data: {
                    mobile: 'XXXXXX' + Math.floor(1000 + Math.random() * 9000),
                },
            };
        }

        // Surface server error details if present
        if (error.response)
        {
            throw new Error(
                `Request failed: ${error.response.status} ${JSON.stringify(error.response.data)}`
            );
        }

        throw error;
    }
}


export async function verifyLoginOTP(
    username: string,
    password: string,
    otp: string
): Promise<VerifyOTPResponse>
{
    

    try
    {
        const loginDetails = {
            username: username,
            password: password,
            otp:otp
        };


        const formEncodedBody = Object.entries(loginDetails)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        };
        return apiClient.makeRequest<LoginOTPResponse>({
            url: VERIFY_OTP_URL,
            method: 'POST',
            headers: requestHeaders,
            body: formEncodedBody,
            timeout: 30000,
        });

    } catch (error)
    {
        if (error instanceof TypeError && error.message.includes('fetch'))
        {
            // CORS error - simulate success for development
            console.warn('CORS blocked. Using mock response for development.');
            // Mock: accept any 4-digit OTP for testing
            if (otp.length === 4)
            {
                return {
                    status: true,
                    message: 'Login successful (mock)',
                    statuscode: 200,
                    access_token: 'mock-token-' + Date.now(),
                    token_type: 'bearer',
                    expires_in: 86400, // 24 hours
                };
            }
            return {
                status: false,
                message: 'Invalid OTP',
                statuscode: 400,
            };
        }
        throw error;
    }
}
