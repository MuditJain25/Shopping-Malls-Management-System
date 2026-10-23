import { useEffect, useState } from "react";
import { Star, Plus, Link2 } from "lucide-react";
import { PageHeader, Badge, EmptyState } from "@/components/ui/index.jsx";
import Modal from "@/components/ui/Modal.jsx";
import {
  apiGetProducts,
  apiCreateProduct,
  apiAttachProduct,
  apiGetProductsByStore,
  apiToggleProductVisibility,
} from "@/lib/api";
import {
  getProductsByStore,
  products,
  storeProducts,
  productImages,
} from "@/lib/mockData.js";

export default function ProductsView({ stores, role }) {
  const isShopManager = role === "shop_manager";

  const [refresh, setRefresh] = useState(0);
  const [selectedStore, setSelectedStore] = useState(stores[0]?.store_id || "");
  const [showAdd, setShowAdd] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState("existing");
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    category: "Fashion",
    price: "",
    imageUrl: "",
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState("");
  const [tenantProducts, setTenantProducts] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState("");

  const store = stores.find((s) => s.store_id === selectedStore) || stores[0];
  const storeId = store?.store_id;
  useEffect(() => {
    if (isShopManager || storeId == null) return;

    let cancelled = false;

    setTenantProducts([]);

    apiGetProductsByStore(storeId)
      .then((data) => {
        if (!cancelled) {
          setTenantProducts(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load store products", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isShopManager, storeId]);

  useEffect(() => {
    if (isShopManager || !showAdd || activeProductTab !== "existing") {
      setCatalogLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setCatalogLoading(true);
      setCatalogError("");

      try {
        const data = await apiGetProducts(catalogSearch.trim());

        if (!cancelled) {
          setCatalogProducts(data);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogProducts([]);
          setCatalogError(
            error.message || "Failed to load the product catalog.",
          );
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isShopManager, showAdd, activeProductTab, catalogSearch]);

  const storeProductList = !store
    ? []
    : isShopManager
      ? getProductsByStore(store.store_id)
      : tenantProducts;

  const alreadyLinkedIds = new Set(
    (isShopManager
      ? storeProducts.filter(
          (item) => String(item.store_id) === String(store?.store_id),
        )
      : tenantProducts
    ).map((product) => String(product.product_id)),
  );

  const availableCatalogProducts = (
    isShopManager ? products : catalogProducts
  ).filter((product) => {
    const notLinked = !alreadyLinkedIds.has(String(product.product_id));

    const matchesSearch = isShopManager
      ? (product.product_name ?? "")
          .toLowerCase()
          .includes(catalogSearch.trim().toLowerCase())
      : true;

    return notLinked && matchesSearch;
  });

  const handleToggle = async (productId, currentShow) => {
    const nextShow = !currentShow;

    if (isShopManager) {
      const sp = storeProducts.find(
        (sp) => sp.store_id === store.store_id && sp.product_id === productId,
      );

      if (sp) sp.to_show = !currentShow;
      setRefresh((r) => r + 1);
      return;
    }

    try {
      await apiToggleProductVisibility(store.store_id, productId, nextShow);

      setTenantProducts((currentProducts) =>
        currentProducts.map((product) =>
          String(product.product_id) === String(productId)
            ? { ...product, to_show: nextShow }
            : product,
        ),
      );
    } catch (error) {
      console.error("Failed to update product visibility:", error);
    }
  };

  const handleAddProduct = async () => {
    if (!store) return;

    const productName = newProduct.product_name.trim();
    const price = Number(newProduct.price);

    if (
      !productName ||
      newProduct.price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setProductError("Enter a product name and a valid, non-negative price.");
      return;
    }

    setSavingProduct(true);
    setProductError("");

    try {
      if (isShopManager) {
        const productId = `p${Date.now()}`;
        products.push({
          product_id: productId,
          product_name: newProduct.product_name,
          category: newProduct.category,
          price: parseFloat(newProduct.price) || 0,
          imageUrl: newProduct.imageUrl || productImages.fashion[0],
        });
        storeProducts.push({
          store_id: store.store_id,
          product_id: productId,
          to_show: false,
        });
      } else {
        const created = await apiCreateProduct({
          product_name: productName,
          category: newProduct.category,
          price,
          image_url: newProduct.imageUrl.trim() || null,
        });

        const productId = created.product_id;

        if (productId == null) {
          throw new Error(
            "The product was created but the response did not include it's ID.",
          );
        }

        await apiAttachProduct(store.store_id, productId, false);

        setTenantProducts((current) => [
          ...current,
          {
            ...created,
            to_show: false,
          },
        ]);
      }

      setShowAdd(false);
      setNewProduct({
        product_name: "",
        category: "Fashion",
        price: "",
        imageUrl: "",
      });
      setProductError("");
      setActiveProductTab("existing");

      if (isShopManager) {
        setRefresh((r) => r + 1);
      }
    } catch (error) {
      setProductError(
        error.message || "Failed to add the product. Please try again.",
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleLinkProduct = async () => {
    if (!store || !selectedCatalogProductId) return;

    const product = availableCatalogProducts.find(
      (item) => String(item.product_id) === selectedCatalogProductId,
    );

    if (!product) {
      setProductError("Please select an available product.");
      return;
    }

    setSavingProduct(true);
    setProductError("");

    try {
      if (isShopManager) {
        storeProducts.push({
          store_id: store.store_id,
          product_id: product.product_id,
          to_show: false,
        });

        setRefresh((r) => r + 1);
      } else {
        await apiAttachProduct(store.store_id, product.product_id, false);

        setTenantProducts((currentProducts) => {
          const alreadyLinked = currentProducts.some(
            (item) => String(item.product_id) === String(product.product_id),
          );

          if (alreadyLinked) return currentProducts;

          return [...currentProducts, { ...product, to_show: false }];
        });
      }

      setCatalogSearch("");
      setSelectedCatalogProductId("");
      setProductError("");
    } catch (error) {
      setProductError(
        error.message || "Failed to link the product to this store.",
      );
    } finally {
      setSavingProduct(false);
    }
  };

  if (!store)
    return (
      <EmptyState title="No stores" message="You don't have any stores yet." />
    );

  const CATEGORIES = ["Fashion", "Electronics", "Home & Decor", "Beauty"];

  return (
    <div key={refresh}>
      <PageHeader
        title="Products"
        subtitle="Manage your product listings and top-selling flags"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary text-sm"
          >
            <Plus size={16} /> Add Product
          </button>
        }
      />
      {stores.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {stores.map((s) => (
            <button
              key={s.store_id}
              onClick={() => setSelectedStore(s.store_id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${selectedStore === s.store_id ? "bg-brand-600 text-white" : "bg-white border border-slate-300 text-slate-600"}`}
            >
              {s.store_name}
            </button>
          ))}
        </div>
      )}

      <div className="card p-3 mb-4 bg-brand-50 border-brand-200">
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <Star size={14} className="text-amber-500" />
          Toggle the star to feature products as "Top Selling"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storeProductList.map((product) => (
          <div key={product.product_id} className="card overflow-hidden">
            <div className="relative h-32 overflow-hidden bg-slate-100">
              <img
                src={product.imageUrl}
                alt={product.product_name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() =>
                  handleToggle(product.product_id, product.to_show)
                }
                className={`absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center ${product.to_show ? "bg-amber-500 text-white" : "bg-white/80 text-slate-400"}`}
              >
                {product.to_show ? (
                  <Star size={14} fill="currentColor" />
                ) : (
                  <Star size={14} />
                )}
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-400">{product.category}</p>
              <h3 className="font-medium text-slate-800 text-sm">
                {product.product_name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-brand-600 text-sm">
                  ${product.price.toFixed(2)}
                </p>
                {product.to_show ? (
                  <Badge variant="warning">Top Selling</Badge>
                ) : (
                  <Badge variant="neutral">Hidden</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Product"
        size="md"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveProductTab("existing");
                setProductError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                activeProductTab === "existing"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Link2 size={15} />
              Link Existing Product
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveProductTab("new");
                setProductError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                activeProductTab === "new"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Plus size={15} />
              Add New Product
            </button>
          </div>

          {/* Tab content */}
          {activeProductTab === "existing" ? (
            <div className="space-y-4">
              <div>
                <label className="label">Search Product Catalog</label>
                <input
                  className="input"
                  value={catalogSearch}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value);
                    setSelectedCatalogProductId("");
                  }}
                  placeholder="Search by product name..."
                />
              </div>

              {catalogLoading ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Searching products...
                </p>
              ) : catalogError ? (
                <p className="text-sm text-red-600">{catalogError}</p>
              ) : availableCatalogProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No unlinked products found.
                </p>
              ) : (
                <div className="max-h-[30vh] space-y-2 overflow-y-auto">
                  {availableCatalogProducts.map((product) => {
                    const productId = String(product.product_id);
                    const isSelected = selectedCatalogProductId === productId;

                    return (
                      <button
                        key={productId}
                        type="button"
                        onClick={() => setSelectedCatalogProductId(productId)}
                        className={`w-full rounded-lg border p-3 text-left transition ${
                          isSelected
                            ? "border-brand-600 bg-brand-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-medium text-slate-800">
                          {product.product_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {product.category} · $
                          {Number(product.price ?? 0).toFixed(2)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {productError && (
                <p className="text-sm text-red-600" role="alert">
                  {productError}
                </p>
              )}

              <button
                type="button"
                onClick={handleLinkProduct}
                disabled={!selectedCatalogProductId || savingProduct}
                className="btn-primary w-full disabled:opacity-60"
              >
                {savingProduct ? "Linking Product..." : "Link Product to Store"}
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Product Name</label>
                <input
                  className="input"
                  value={newProduct.product_name}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      product_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Cotton Shirt"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Price ($)</label>
                <input
                  type="number"
                  className="input"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  placeholder="e.g. 49.99"
                />
              </div>
              <div>
                <label className="label">Image URL (optional)</label>
                <input
                  className="input"
                  value={newProduct.imageUrl}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, imageUrl: e.target.value })
                  }
                  placeholder="Leave blank for default"
                />
              </div>
              {productError && (
                <p className="text-sm text-red-600" role="alert">
                  {productError}
                </p>
              )}
              <button
                onClick={handleAddProduct}
                disabled={savingProduct}
                className="btn-primary w-full disabled:opacity-60"
              >
                {savingProduct ? "Adding Product..." : "Add Product"}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
