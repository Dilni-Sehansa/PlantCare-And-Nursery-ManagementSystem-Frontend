import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import { getPlantTypes, createPlantType } from "../data/plantType";
import type { Category, PlantTypeItem } from "../data/plantType";

const CATEGORIES: Category[] = ["Indoor", "Outdoor", "Indoor & Outdoor"];

const PlantType = () => {
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [plantTypes, setPlantTypes] = useState<PlantTypeItem[]>([]);
  const [filter, setFilter] = useState<Category | "All">("All");
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [listError, setListError] = useState("");

  const loadPlantTypes = async () => {
    try {
      setLoadingList(true);
      setListError("");

      const data = await getPlantTypes(
        filter === "All" ? undefined : filter
      );

      setPlantTypes(data);

    } catch (error) {
      console.error("Error in Loading Plant Types:", error);

      if (axios.isAxiosError(error)) {
        setListError(
          error.response?.data?.message || "Could not load plant types."
        );
      } else {
        setListError("Could not load plant types.");
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadPlantTypes();
  }, [filter]);

  const toggleCategory = (category: Category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(
        selectedCategories.filter((item) => item !== category)
      );
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFormError("");
    setSuccess("");
    if (!name.trim()) {
      return setFormError("Plant type name is required.");
    }
    if (selectedCategories.length === 0) {
      return setFormError("Please select at least one category.");
    }

    try {

      setSaving(true);
      await createPlantType(name.trim(), selectedCategories);
      setSuccess(`"${name.trim()}" was added successfully.`);
      setName("");
      setSelectedCategories([]);
      await loadPlantTypes();

    } catch (error) {
      console.error("Error in Adding Plant Type:", error);
      if (axios.isAxiosError(error)) {
        setFormError(
          error.response?.data?.message || "Could not add plant type."
        );
      } else {
        setFormError("Could not add plant type.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50">

      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Plant Types
            </h1>

            <p className="text-gray-500 text-sm">
              Add plant types and organize them by category
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-1/3">

              <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">

                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Add Plant Type
                </h2>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                    {formError}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                    {success}
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Plant Type Name
                    </label>

                    <input
                      type="text"
                      placeholder="Enter plant type name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Categories
                    </label>

                    <div className="space-y-2">
                      {CATEGORIES.map((category) => (

                        <label
                          key={category}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                            selectedCategories.includes(category)
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="w-4 h-4 accent-green-600"
                          />

                          <span className="text-sm text-gray-700">
                            {category}
                          </span>

                        </label>

                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {saving ? "Adding..." : "Add Plant Type"}
                  </button>
                </form>
              </div>
            </div>

            <div className="w-full lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                  <h2 className="text-xl font-bold text-gray-800">
                    All Plant Types
                  </h2>

                  <select
                    value={filter}
                    onChange={(e) =>
                      setFilter(e.target.value as Category | "All")
                    }
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                  >

                    <option value="All">
                      All Categories
                    </option>

                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                </div>

                {listError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                    {listError}
                  </div>
                )}

                {loadingList ? (

                  <p className="text-gray-500 text-sm py-8 text-center">
                    Loading plant types...
                  </p>

                ) : plantTypes.length === 0 ? (

                  <p className="text-gray-500 text-sm py-8 text-center">
                    No plant types found. Add one using the form.
                  </p>

                ) : (

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {plantTypes.map((plantType) => (

                      <div
                        key={plantType._id}
                        className="bg-green-50 rounded-xl p-5 border border-green-100"
                      >

                        <h3 className="font-bold text-gray-800 mb-3">
                          {plantType.name}
                        </h3>

                        <div className="flex flex-wrap gap-2">
                          {plantType.categories.map((category) => (

                            <span
                              key={category}
                              className="bg-white text-green-700 text-xs font-medium px-3 py-1 rounded-full border border-green-200"
                            >
                              {category}
                            </span>

                          ))}

                        </div>
                      </div>

                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlantType;