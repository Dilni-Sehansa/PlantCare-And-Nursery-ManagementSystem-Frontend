import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import { getPlantTypes } from "../data/plantType";
import type { Category, PlantTypeItem } from "../data/plantType";
import {
  getPlants,
  createPlant,
  updatePlant,
  deletePlant,
  getImageUrl,
} from "../data/plants"
import type { PlantItem, PlantMeta, WaterNeed, Sunlight } from "../data/plants";

const CATEGORIES: Category[] = ["Indoor", "Outdoor", "Indoor & Outdoor"];
const WATER_NEEDS: WaterNeed[] = ["Low", "Medium", "High"];
const SUNLIGHTS: Sunlight[] = ["Full", "Indirect", "Low"];
const PAGE_SIZE = 8;
const LOW_STOCK_LIMIT = 10;

const CATEGORY_ICON: Record<Category, string> = {
  Indoor: "🪴",
  Outdoor: "🌳",
  "Indoor & Outdoor": "🌿",
};


const emptyForm = {
  name: "",
  description: "",
  category: "" as Category | "",
  plantType: "",
  waterNeed: "" as WaterNeed | "",
  sunlight: "" as Sunlight | "",
  price: "",
  stock: "",
  careTips: "",
};

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const PlantImage = ({ src, alt }: { src: string; alt: string }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-50 to-[#e8f5e9] flex flex-col items-center justify-center text-green-600">
        <span className="text-5xl mb-2">🪴</span>
        <span className="text-xs font-medium">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
    />
  );
};

const Plant = () => {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [meta, setMeta] = useState<PlantMeta | null>(null);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [listSuccess, setListSuccess] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [formPlantTypes, setFormPlantTypes] = useState<PlantTypeItem[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPlants = async () => {
      try {
        setLoadingList(true);
        setListError("");

        const result = await getPlants({
          page,
          limit: PAGE_SIZE,
          category: categoryFilter === "All" ? undefined : categoryFilter,
          search: search || undefined,
        });

        setPlants(result.plants);
        setMeta(result.meta);
      } catch (error) {
        console.error("Error in Loading Plants:", error);
        setListError(getErrorMessage(error, "Could not load plants."));
      } finally {
        setLoadingList(false);
      }
    };

    loadPlants();
  }, [page, categoryFilter, search, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!form.category) {
      setFormPlantTypes([]);
      return;
    }

    const loadTypes = async () => {
      try {
        setLoadingTypes(true);
        const data = await getPlantTypes(form.category as Category);
        setFormPlantTypes(data);
      } catch (error) {
        console.error("Error in Loading Plant Types:", error);
        setFormPlantTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadTypes();
  }, [form.category]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const shownImage =
    previewUrl || (existingImage ? getImageUrl(existingImage) : "");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, category: e.target.value as Category, plantType: "" });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please choose an image file.");
      e.target.value = "";
      return;
    }

    setFormError("");
    setImageFile(file);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setExistingImage("");
    setEditingId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEdit = (plant: PlantItem) => {
    setFormError("");
    setFormSuccess("");
    setEditingId(plant.plantId);
    setForm({
      name: plant.name,
      description: plant.description || "",
      category: plant.category[0],
      plantType: plant.plantType,
      waterNeed: plant.waterNeed,
      sunlight: plant.sunlight,
      price: String(plant.price),
      stock: String(plant.stock),
      careTips: plant.careTips || "",
    });
    setImageFile(null);
    setExistingImage(plant.image || "");
    if (fileInputRef.current) fileInputRef.current.value = "";

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.name.trim()) {
      return setFormError("Plant name is required.");
    }
    if (!form.category) {
      return setFormError("Please select a category.");
    }
    if (!form.plantType) {
      return setFormError("Please select a plant type.");
    }
    if (!form.waterNeed) {
      return setFormError("Please select the water need.");
    }
    if (!form.sunlight) {
      return setFormError("Please select the sunlight requirement.");
    }
    if (form.price.trim() === "" || Number(form.price) < 0) {
      return setFormError("Enter a valid price.");
    }
    if (
      form.stock.trim() === "" ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      return setFormError("Stock must be a whole number (0 or more).");
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("category", form.category);
    formData.append("plantType", form.plantType);
    formData.append("waterNeed", form.waterNeed);
    formData.append("sunlight", form.sunlight);
    formData.append("price", form.price);
    formData.append("stock", form.stock);
    formData.append("careTips", form.careTips.trim());

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      setSaving(true);

      if (editingId) {
        await updatePlant(editingId, formData);
        setFormSuccess(`"${form.name.trim()}" was updated successfully.`);
      } else {
        await createPlant(formData);
        setFormSuccess(`"${form.name.trim()}" was added successfully.`);
        setPage(1);
      }

      resetForm();
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Error in Saving Plant:", error);
      setFormError(getErrorMessage(error, "Could not save plant."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plant: PlantItem) => {
    if (!window.confirm(`Delete "${plant.name}"? This cannot be undone.`)) {
      return;
    }

    setListError("");
    setListSuccess("");

    try {
      setDeletingId(plant.plantId);
      await deletePlant(plant.plantId);
      setListSuccess(`"${plant.name}" was deleted.`);

      if (editingId === plant.plantId) resetForm();

      if (plants.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (error) {
      console.error("Error in Deleting Plant:", error);
      setListError(getErrorMessage(error, "Could not delete plant."));
    } finally {
      setDeletingId("");
    }
  };

  const handleFilterChange = (option: Category | "All") => {
    setCategoryFilter(option);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />

      <section className="bg-[#e8f5e9] pt-28 pb-12 px-6 relative overflow-hidden">
        <div className="absolute -right-16 top-10 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-60"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/70 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-5 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Nursery Management
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 leading-tight mb-4">
            Manage your
            <br />
            <span className="text-green-700">plants</span>
          </h1>

          <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-xl">
            Add new plants with photos, keep track of price and stock, and
            update your collection anytime.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/plantType"
              className="bg-green-700 hover:bg-green-800 text-white font-semibold text-sm px-6 py-3 rounded-full shadow-md transition hover:scale-105"
            >
              Manage Plant Types
            </Link>

            {meta && !listError && (
              <span className="bg-white/70 text-green-700 text-sm font-medium px-4 py-3 rounded-full shadow-sm">
                {meta.total} {meta.total === 1 ? "plant" : "plants"}
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
          <div
            ref={formRef}
            className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-24 scroll-mt-24"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {editingId ? "Edit Plant" : "Add Plant"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {editingId
                    ? `Updating ${editingId}`
                    : "Fill in the details of your new plant"}
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                  {formSuccess}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <p className={labelClass}>Plant Image</p>

                  <div className="aspect-[4/3] rounded-xl overflow-hidden border border-green-100 bg-green-50 mb-3">
                    {shownImage ? (
                      <img
                        src={shownImage}
                        alt="Plant preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-green-600">
                        <span className="text-5xl mb-2">🪴</span>
                        <span className="text-xs font-medium">
                          Image preview
                        </span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer"
                  />
                  {editingId && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Leave empty to keep the current image.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className={labelClass}>
                    Plant Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter plant name"
                    className={inputClass}
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="description" className={labelClass}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    placeholder="Short description (optional)"
                    className={inputClass}
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className={labelClass}>
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      className={inputClass}
                      value={form.category}
                      onChange={handleCategoryChange}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="plantType" className={labelClass}>
                      Plant Type
                    </label>
                    <select
                      id="plantType"
                      name="plantType"
                      className={inputClass}
                      value={form.plantType}
                      onChange={handleChange}
                      disabled={!form.category || loadingTypes}
                    >
                      <option value="">
                        {!form.category
                          ? "Select category first"
                          : loadingTypes
                          ? "Loading..."
                          : "Select plant type"}
                      </option>
                      {formPlantTypes.map((type) => (
                        <option key={type._id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.category && !loadingTypes && formPlantTypes.length === 0 && (
                  <p className="text-xs text-gray-500 -mt-2">
                    No plant types for this category yet.{" "}
                    <Link
                      to="/plantType"
                      className="text-green-700 font-medium hover:underline"
                    >
                      Add one here
                    </Link>
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="waterNeed" className={labelClass}>
                      Water Need
                    </label>
                    <select
                      id="waterNeed"
                      name="waterNeed"
                      className={inputClass}
                      value={form.waterNeed}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      {WATER_NEEDS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sunlight" className={labelClass}>
                      Sunlight
                    </label>
                    <select
                      id="sunlight"
                      name="sunlight"
                      className={inputClass}
                      value={form.sunlight}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      {SUNLIGHTS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className={labelClass}>
                      Price (Rs.)
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={inputClass}
                      value={form.price}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="stock" className={labelClass}>
                      Stock
                    </label>
                    <input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      className={inputClass}
                      value={form.stock}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="careTips" className={labelClass}>
                    Care Tips
                  </label>
                  <textarea
                    id="careTips"
                    name="careTips"
                    rows={3}
                    placeholder="Watering, light and fertilizer tips (optional)"
                    className={inputClass}
                    value={form.careTips}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Plant"
                      : "Add Plant"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setFormError("");
                      }}
                      className="px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="w-full min-w-0 flex-1">
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  All Plants
                </h2>
                <p className="text-gray-500 text-sm">
                  Search and filter your plant collection
                </p>
              </div>

              <input
                type="text"
                placeholder="Search plants by name..."
                className={`${inputClass} mb-4`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />

              <div className="flex flex-wrap gap-2 mb-6">
                {(["All", ...CATEGORIES] as (Category | "All")[]).map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleFilterChange(option)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                        categoryFilter === option
                          ? "bg-green-700 text-white border-green-700 shadow-sm"
                          : "bg-white text-gray-600 border-green-100 hover:border-green-300 hover:text-green-700"
                      }`}
                    >
                      {option === "All" ? "All Categories" : option}
                    </button>
                  )
                )}
              </div>

              {listError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                  {listError}
                </div>
              )}

              {listSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                  {listSuccess}
                </div>
              )}

              {loadingList ? (
                <div className="flex flex-col items-center py-16 text-gray-500 text-sm">
                  <span className="w-8 h-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-3"></span>
                  Loading plants...
                </div>
              ) : plants.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🌱</div>
                  <p className="text-gray-500 text-sm">
                    No plants found. Add one using the form.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {plants.map((plant) => (
                    <div
                      key={plant._id}
                      className="group bg-white rounded-2xl border border-green-100 shadow-sm hover:shadow-lg hover:border-green-300 transition overflow-hidden flex flex-col"
                    >
   
                      <div className="relative aspect-[4/3] overflow-hidden bg-green-50">
                        <PlantImage
                          key={plant.image}
                          src={getImageUrl(plant.image)}
                          alt={plant.name}
                        />

                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-green-700 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                          {CATEGORY_ICON[plant.category[0]]} {plant.category[0]}
                        </span>

                        {plant.stock <= LOW_STOCK_LIMIT && (
                          <span
                            className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
                              plant.stock === 0
                                ? "bg-red-500 text-white"
                                : "bg-amber-400 text-amber-900"
                            }`}
                          >
                            {plant.stock === 0 ? "Out of stock" : "Low stock"}
                          </span>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="font-bold text-gray-800 text-lg leading-snug">
                            {plant.name}
                          </h3>
                          <span className="text-green-700 font-bold whitespace-nowrap">
                            Rs. {Number(plant.price).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 mb-3">
                          {plant.plantId} · {plant.plantType}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="bg-green-50 text-gray-600 text-xs px-3 py-1 rounded-full border border-green-100">
                            ☀️ {plant.sunlight} light
                          </span>
                          <span className="bg-green-50 text-gray-600 text-xs px-3 py-1 rounded-full border border-green-100">
                            💧 {plant.waterNeed} water
                          </span>
                          <span className="bg-green-50 text-gray-600 text-xs px-3 py-1 rounded-full border border-green-100">
                            📦 {plant.stock} in stock
                          </span>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button
                            type="button"
                            onClick={() => startEdit(plant)}
                            className="flex-1 border border-green-200 text-green-700 hover:bg-green-50 font-semibold text-sm py-2.5 rounded-xl transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(plant)}
                            disabled={deletingId === plant.plantId}
                            className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 font-semibold text-sm py-2.5 rounded-xl transition"
                          >
                            {deletingId === plant.plantId
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1 || loadingList}
                    className="px-5 py-2 rounded-full border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 disabled:opacity-40 transition"
                  >
                    ← Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {meta.page} of {meta.totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= meta.totalPages || loadingList}
                    className="px-5 py-2 rounded-full border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 disabled:opacity-40 transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Plant;