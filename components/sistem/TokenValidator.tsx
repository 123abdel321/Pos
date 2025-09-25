"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const TokenValidator: React.FC = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { login, isAuthenticated, loading } = useAuth();

	useEffect(() => {
		const validateTokenFromURL = async () => {
			const token = searchParams.get("token");

			if (token && !isAuthenticated && !loading) {
				try {
					const result = await login(token);
					if (result.success) {
						// Redirigir a dashboard o página principal
						router.replace("/dashboard");
					} else {
						router.replace("/login?error=invalid_token");
					}
				} catch (error) {
					router.replace("/login?error=validation_error");
				}
			}
		};

		validateTokenFromURL();
	}, [searchParams, isAuthenticated, loading, login, router]);

	return null;
};

export default TokenValidator;
