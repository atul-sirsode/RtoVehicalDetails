import { RCApiResponse, RCData, RCTableRow } from '@/types/rc-verification';
import { apiClient } from "@/lib/apiClient";
const API_URL = 'https://api.verifya2z.com/api/v1/api/rc_verify';

export function getAuthToken(): string | null
{
    return sessionStorage.getItem('accessToken');
}

export async function verifyRC(rcNumber: string): Promise<RCApiResponse>
{
    // NOTE: This API call needs to be made from a backend server due to CORS restrictions
    // For production, you should:
    // 1. Create a backend proxy endpoint (Node.js, Next.js API route, or C# endpoint)
    // 2. Add your API authentication headers
    // 3. Call the API from the server and return results to the client

    const token = getAuthToken();

    const formData = new URLSearchParams();
    formData.append('id_number', rcNumber);

    try
    {
        //const response = await fetch(API_URL, {
        //    method: 'POST',
        //    headers: {
        //        'Content-Type': 'application/x-www-form-urlencoded',
        //        ...(token && { 'Authorization': `Bearer ${token}` }),
        //    },
        //    body: formData,
        //});

        //if (!response.ok)
        //{
        //    throw new Error(`API request failed with status ${response.status}`);
        //}

        //return await response.json();

        const loginDetails = {
            id_number: rcNumber
        };


        const formEncodedBody = Object.entries(loginDetails)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };
        return apiClient.makeRequest<RCApiResponse>({
            url: API_URL,
            method: 'POST',
            headers: requestHeaders,
            body: formEncodedBody,
            timeout: 30000,
        });
    } catch (error)
    {
        // If CORS blocks the request, throw a meaningful error
        if (error instanceof TypeError && error.message.includes('fetch'))
        {
            throw new Error('CORS_ERROR: API must be called from a backend server. Please configure your backend proxy.');
        }
        throw error;
    }
}

export function transformRCDataToTableRow(data: RCData, id: string): RCTableRow
{
    // Determine address - use present_address, fall back to permanent_address if different
    const address = data.present_address !== data.permanent_address && data.permanent_address
        ? `${data.present_address} / ${data.permanent_address}`
        : data.present_address;

    return {
        id,
        rc_number: data.rc_number,
        owner_name: data.owner_name,
        address,
        vehicle_category: data.vehicle_category,
        vehicle_chasi_number: data.vehicle_chasi_number,
        vehicle_engine_number: data.vehicle_engine_number,
        maker_description: data.maker_description,
        maker_model: data.maker_model,
        body_type: data.body_type,
        fuel_type: data.fuel_type,
        norms_type: data.norms_type,
        financed: data.financed === 'true',
        insurance_company: data.insurance_company,
        insurance_policy_number: data.insurance_policy_number,
        insurance_upto: data.insurance_upto,
        manufacturing_date_formatted: data.manufacturing_date_formatted,
        registered_at: data.registered_at,
        latest_by: data.latest_by,
        tax_upto: data.tax_upto,
        cubic_capacity: data.cubic_capacity,
        vehicle_gross_weight: data.vehicle_gross_weight,
        no_cylinders: data.no_cylinders,
        seat_capacity: data.seat_capacity,
        unladen_weight: data.unladen_weight,
        vehicle_category_description: data.vehicle_category_description,
        pucc_number: data.pucc_number,
        pucc_upto: data.pucc_upto,
        permit_number: data.permit_number,
        permit_valid_upto: data.permit_valid_upto,
        permit_type: data.permit_type,
        owner_number: data.owner_number,
        rc_status: data.rc_status,
        status: 'success',
    };
}

export function createPendingRow(rcNumber: string, id: string): RCTableRow
{
    return {
        id,
        rc_number: rcNumber,
        owner_name: '',
        address: '',
        vehicle_category: '',
        vehicle_chasi_number: '',
        vehicle_engine_number: '',
        maker_description: '',
        maker_model: '',
        body_type: '',
        fuel_type: '',
        norms_type: '',
        financed: false,
        insurance_company: '',
        insurance_policy_number: '',
        insurance_upto: '',
        manufacturing_date_formatted: '',
        registered_at: '',
        latest_by: '',
        tax_upto: '',
        cubic_capacity: '',
        vehicle_gross_weight: '',
        no_cylinders: '',
        seat_capacity: '',
        unladen_weight: '',
        vehicle_category_description: '',
        pucc_number: '',
        pucc_upto: '',
        permit_number: '',
        permit_valid_upto: '',
        permit_type: '',
        owner_number: '',
        rc_status: '',
        status: 'pending',
    };
}

// Mock function to simulate API response for development
export function getMockRCData(rcNumber: string): RCApiResponse
{
    return {
        reference_id: Math.floor(Math.random() * 1000000000),
        statuscode: 200,
        message: "success",
        status: true,
        data: {
            rc_number: rcNumber,
            fit_up_to: "2026-02-27",
            registration_date: "2011-05-02",
            owner_name: "SAMPLE OWNER " + Math.floor(Math.random() * 100),
            father_name: "",
            present_address: "Sample City, 441004",
            permanent_address: "Sample City, 441004",
            mobile_number: "",
            vehicle_category: "HGV",
            vehicle_chasi_number: "MAT" + Math.random().toString(36).substring(2, 15).toUpperCase(),
            vehicle_engine_number: "11C" + Math.floor(Math.random() * 100000000),
            maker_description: "TATA MOTORS LTD",
            maker_model: "LPS 4018 BSIII",
            body_type: "OPEN GOODS TRAILER",
            fuel_type: "DIESEL",
            color: "0",
            norms_type: "BHARAT STAGE III",
            financer: "",
            financed: Math.random() > 0.5 ? "true" : "false",
            insurance_company: "Reliance General Insurance Co. Ltd.",
            insurance_policy_number: "170822523490" + Math.floor(Math.random() * 1000000),
            insurance_upto: "2026-07-04",
            manufacturing_date: "12/2010",
            manufacturing_date_formatted: "2010-12",
            registered_at: "Sample RTO, Maharashtra",
            latest_by: "2026-02-02",
            less_info: true,
            tax_upto: "2026-01-31",
            tax_paid_upto: "",
            cubic_capacity: "5883.00",
            vehicle_gross_weight: "45500",
            no_cylinders: "6",
            seat_capacity: "3",
            sleeper_capacity: "0",
            standing_capacity: "0",
            wheelbase: "0",
            unladen_weight: "11600",
            vehicle_category_description: "Articulated Vehicle(HGV)",
            pucc_number: "MH04001830" + Math.floor(Math.random() * 1000000),
            pucc_upto: "2026-03-05",
            permit_number: "MH2025-GP-" + Math.floor(Math.random() * 10000) + "F",
            permit_issue_date: "null",
            permit_valid_from: "null",
            permit_valid_upto: "2030-06-03",
            permit_type: "GOODS PERMIT",
            national_permit_number: "",
            national_permit_issue_date: "",
            national_permit_upto: "",
            national_permit_issued_by: "",
            non_use_status: "",
            non_use_from: "null",
            non_use_to: "null",
            blacklist_status: "",
            noc_details: "",
            owner_number: "2",
            rc_status: "ACTIVE",
            masked_name: false,
            challan_details: null,
            variant: "null"
        }
    };
}
