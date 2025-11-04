"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.productId as Id<"products">;

  const product = useQuery(api.products.queries.getProductById, { productId });

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">This product does not exist.</p>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">View Product</h1>
        <p className="text-gray-600 mt-2">Product details (Edit functionality coming soon)</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            {product.primaryImage && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Primary Image</h3>
                <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                  <Image
                    src={product.primaryImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {product.images && product.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Images</h3>
                <div className="grid grid-cols-3 gap-2">
                  {product.images.map((url, index) => (
                    <div key={index} className="relative aspect-square border rounded-lg overflow-hidden">
                      <Image
                        src={url}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Name</h3>
              <p className="text-lg font-semibold text-gray-900">{product.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Description</h3>
              <p className="text-gray-900">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Price</h3>
                <p className="text-lg font-semibold text-gray-900">${(product.price / 100).toFixed(2)}</p>
              </div>

              {product.compareAtPrice && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Compare At Price</h3>
                  <p className="text-lg text-gray-600 line-through">${(product.compareAtPrice / 100).toFixed(2)}</p>
                </div>
              )}
            </div>

            {product.sku && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">SKU</h3>
                <p className="text-gray-900 font-mono">{product.sku}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Inventory</h3>
                <p className="text-gray-900">{product.inventoryQuantity} units</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700">Status</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                  product.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {product.status}
                </span>
              </div>
            </div>

            {product.category && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Category</h3>
                <p className="text-gray-900">{product.category}</p>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Tags</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Created: {new Date(product.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Updated: {new Date(product.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
