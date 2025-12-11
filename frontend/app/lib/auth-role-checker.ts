// frontend/app/lib/auth-role-checker.ts

// Define the expected role enumeration 
export enum Role {
    User = 'User',
    Admin = 'Admin',
}

/**
 * Reads the JWT from localStorage and extracts the user's role.
 * Returns null if the token is missing or invalid.
 */
export const getUserRole = (): Role | null => {
    if (typeof window === 'undefined') {
        return null; 
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
        return null;
    }

    try {
        // JWTs have three parts: Header.Payload.Signature
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) {
            return null;
        }
        
        // Decode the Base64 payload (URL-safe Base64 decoding)
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
        const payload = JSON.parse(payloadJson);
        
        // Return the role, assuming the JWT payload key is 'role'
        return payload.role as Role;
        
    } catch (error) {
        console.error("Failed to decode JWT:", error);
        return null; // Token invalid or corrupted
    }
};

export const isAdmin = (): boolean => {
    return getUserRole() === Role.Admin;
};