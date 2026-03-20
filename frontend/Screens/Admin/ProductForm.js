import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import FormContainer from "../../Shared/FormContainer";
import Input from "../../Shared/Input";
import EasyButton from "../../Shared/StyledComponents/EasyButton";
import Toast from "react-native-toast-message";
import { getJwt } from "../../assets/common/jwtStore";
import baseURL from "../../assets/common/baseurl";
import Error from "../../Shared/Error";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import mime from "mime";
import { Ionicons } from "@expo/vector-icons";

const ProductForm = (props) => {
    const MAX_IMAGES = 8;
    const [pickerValue, setPickerValue] = useState("");
    const [brand, setBrand] = useState("");
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState([]); // array of uris
    const [mainImage, setMainImage] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [countInStock, setCountInStock] = useState("");
    const [rating, setRating] = useState(0);
    const [isFeatured, setIsFeatured] = useState(false);
    const [richDescription, setRichDescription] = useState("");
    const [numReviews, setNumReviews] = useState(0);
    const [item, setItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePicked, setImagePicked] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        if (props.route?.params?.item) {
            const i = props.route.params.item;
            setItem(i);
            setBrand(i.brand || "");
            setName(i.name || "");
            setPrice(String(i.price ?? ""));
            setDescription(i.description || "");
            if (i.images && Array.isArray(i.images) && i.images.length > 0) {
                setImages(i.images);
                setMainImage(i.images[0]);
            } else if (i.image) {
                setImages([i.image]);
                setMainImage(i.image);
            } else {
                setImages([]);
                setMainImage("");
            }
            const catId = i.category?._id || i.category?.id || "";
            setCategory(catId);
            setPickerValue(catId);
            setCountInStock(String(i.countInStock ?? ""));
        } else {
            setItem(null);
        }
        getJwt().then((res) => setToken(res || "")).catch(() => {});
        axios.get(`${baseURL}categories`).then((res) => setCategories(res.data)).catch(() => alert("Error loading categories"));
        if (Platform.OS !== "web") {
            ImagePicker.requestCameraPermissionsAsync().then(({ status }) => {
                if (status !== "granted") alert("Camera roll permission needed.");
            });
        }
        return () => setCategories([]);
    }, [props.route?.params]);

    const pickImage = async () => {
        const allowsMultipleSelection = true;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection,
            allowsEditing: !allowsMultipleSelection, // disables editing if multiple
            aspect: [4, 3],
            quality: 0.55,
        });
        if (!result.canceled) {
            let uris = [];
            if (Array.isArray(result.assets)) {
                uris = result.assets.map((a) => a.uri);
            } else if (result.uri) {
                uris = [result.uri];
            }
            setImages((prev) => {
                const merged = [...prev, ...uris];
                const unique = [...new Set(merged)];
                if (unique.length > MAX_IMAGES) {
                    Toast.show({
                        topOffset: 60,
                        type: "info",
                        text1: `Only ${MAX_IMAGES} images allowed`,
                        text2: "Extra images were skipped.",
                    });
                }
                return unique.slice(0, MAX_IMAGES);
            });
            setMainImage(uris[0]);
            setImagePicked(true);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== "granted") {
            Alert.alert("Permission denied", "Camera access is required to take a photo.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.6,
        });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImages((prev) => {
                const merged = [...new Set([...prev, uri])];
                return merged.slice(0, MAX_IMAGES);
            });
            setMainImage(uri);
            setImagePicked(true);
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            "Product Image",
            "Choose an option",
            [
                { text: "Take Photo", onPress: takePhoto },
                { text: "Choose from Gallery", onPress: pickImage },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    const addProduct = () => {
        if (isSubmitting) return;
        if (!name || !brand || !price || !description || !category || !countInStock) {
            setError("Please fill in the form correctly");
            return;
        }
        if (images.length > MAX_IMAGES) {
            setError(`Only ${MAX_IMAGES} images are allowed`);
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("brand", brand);
        formData.append("price", price);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("countInStock", countInStock);
        formData.append("richDescription", richDescription);
        formData.append("rating", rating);
        formData.append("numReviews", numReviews);
        formData.append("isFeatured", isFeatured);
       const localImages = images.filter(uri => uri.startsWith("file://") || uri.startsWith("content://"));
const remoteImages = images.filter(uri => uri.startsWith("http"));

// Send existing Cloudinary URLs as-is so backend knows to keep them
remoteImages.forEach((url) => {
    formData.append("existingImages", url);
});

// Send new local images as file uploads
if (localImages.length > 0) {
    localImages.forEach((imgUri, idx) => {
    formData.append("images", {
        uri: imgUri,  // use URI directly, no manipulation
        type: mime.getType(imgUri) || "image/jpeg",
        name: imgUri.split("/").pop() || `image${idx}.jpg`,
    });
});
}
        const config = {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: "Bearer " + token,
            },
        };
        const productId = item?.id ?? item?._id;
        const thenNav = () => {
            Toast.show({ topOffset: 60, type: "success", text1: productId ? "Product updated" : "Product added" });
            setTimeout(() => navigation.navigate("Products"), 500);
        };
        const catchErr = (err) => {
            console.log('ProductForm error:', err?.response?.data || err?.message || err);
            const msg = err?.response?.status === 413
                ? "Some images are too large. Use smaller images or fewer files."
                : (err?.response?.data?.message || err?.message || "Something went wrong");
            Toast.show({ topOffset: 60, type: "error", text1: msg });
        };
        const request = productId
            ? axios.put(`${baseURL}products/${productId}`, formData, config)
            : axios.post(`${baseURL}products`, formData, config);

        request
            .then((res) => (res.status === 200 || res.status === 201) && thenNav())
            .catch(catchErr)
            .finally(() => setIsSubmitting(false));
    };

    return (
        <FormContainer title={item ? "Edit Product" : "Add Product"}>
            <View style={styles.imageContainer}>
                {mainImage ? (
                    <Image style={styles.image} source={{ uri: mainImage }} />
                ) : null}
                <TouchableOpacity onPress={showImageOptions} style={styles.imagePicker}>
                    <Ionicons name="camera" style={{ color: "white" }} />
                </TouchableOpacity>
            </View>
            {/* Preview all selected images with delete button */}
            {images.length > 0 && (
                <ScrollView horizontal style={{ marginVertical: 10 }}>
                    {images.map((img, idx) => (
                        <View key={idx} style={{ position: "relative", marginRight: 8 }}>
                            <Image source={{ uri: img }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                            <TouchableOpacity
                                style={{ position: "absolute", top: 0, right: 0, backgroundColor: "#ff4444", borderRadius: 8, padding: 2 }}
                                onPress={() => {
                                    setImages((prev) => prev.filter((_, i) => i !== idx));
                                    if (mainImage === img) {
                                        setMainImage(images.length > 1 ? images[0] : "");
                                    }
                                }}
                            >
                                <Ionicons name="close" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
            <View style={styles.label}><Text style={styles.labelText}>Brand</Text></View>
            <Input placeholder="Brand" name="brand" id="brand" value={brand} onChangeText={setBrand} />
            <View style={styles.label}><Text style={styles.labelText}>Name</Text></View>
            <Input placeholder="Name" name="name" id="name" value={name} onChangeText={setName} />
            <View style={styles.label}><Text style={styles.labelText}>Price</Text></View>
            <Input placeholder="Price" name="price" id="price" value={price} keyboardType="numeric" onChangeText={setPrice} />
            <View style={styles.label}><Text style={styles.labelText}>Count in Stock</Text></View>
            <Input placeholder="Stock" name="stock" id="stock" value={countInStock} keyboardType="numeric" onChangeText={setCountInStock} />
            <View style={styles.label}><Text style={styles.labelText}>Description</Text></View>
            <Input placeholder="Description" name="description" id="description" value={description} onChangeText={setDescription} />
            <View>
                <Picker style={{ height: 100, width: 300 }} selectedValue={pickerValue} onValueChange={(e) => { setPickerValue(e); setCategory(e); }}>
                    {categories.map((c) => (
                        <Picker.Item key={c.id || c._id} label={c.name} value={c.id || c._id} />
                    ))}
                </Picker>
            </View>
            {error ? <Error message={error} /> : null}
            <View style={styles.buttonContainer}>
                <EasyButton large primary onPress={addProduct}>
                    {isSubmitting ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>Confirm</Text>
                    )}
                </EasyButton>
            </View>
        </FormContainer>
    );
};

const styles = StyleSheet.create({
    label: { width: "80%", marginTop: 10 },
    labelText: { textDecorationLine: "underline", color: "#333", fontWeight: "600" },
    buttonContainer: { width: "80%", marginBottom: 100, marginTop: 20, alignItems: "center" },
    buttonText: { color: "white" },
    imageContainer: {
        width: 200,
        height: 200,
        borderStyle: "solid",
        borderWidth: 8,
        padding: 0,
        justifyContent: "center",
        borderRadius: 100,
        borderColor: "#E0E0E0",
        elevation: 10,
    },
    image: { width: "100%", height: "100%", borderRadius: 100 },
    imagePicker: {
        position: "absolute",
        right: 5,
        bottom: 5,
        backgroundColor: "grey",
        padding: 8,
        borderRadius: 100,
        elevation: 20,
    },
});

export default ProductForm;
