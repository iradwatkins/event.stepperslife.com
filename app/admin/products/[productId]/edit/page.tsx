"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as Id<"products">;

  const product = useQuery(api.products.queries.getProductById, { productId });

  // For now, redirect to products list with success message
  // TODO: Build full edit form later
  useEffect(() => {
    if (product) {
      // Product exists and was created successfully
      // Redirect to products list after a brief moment
      const timer = setTimeout(() => {
        router.push("/admin/products");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [product, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Created Successfully!</h2>
        <p className="text-gray-600 mb-4">Redirecting to products list...</p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}
