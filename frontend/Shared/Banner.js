import React, { useState, useEffect } from "react";
import { Image, StyleSheet, Dimensions, View } from "react-native";
import Swiper from "react-native-swiper";

var { width } = Dimensions.get("window");

/**
 * Carousel images: replace with your own.
 * - Slide 1: assets/images/carousel1-sample.png
 * - Slide 2: assets/images/carousel2-sample.png
 * - Slide 3: assets/images/carousel3-sample.png
 */
const Banner = () => {
    const [bannerData, setBannerData] = useState([]);

    useEffect(() => {
        setBannerData([
            require("../assets/images/featured1.jpg"),
            require("../assets/images/featured2.jpg"),
            require("../assets/images/featured3.jpg"),
        ]);
        return () => setBannerData([]);
    }, []);

    return (
        <View style={styles.container}>
            <Swiper
                style={styles.swiper}
                showButtons={false}
                autoplay={true}
                autoplayTimeout={2}
                paginationStyle={styles.pagination}
                dotStyle={styles.dot}
                activeDotStyle={styles.activeDot}
            >
                {bannerData.map((item, index) => (
                    <View style={styles.slide} key={index}>
                        <Image
                            style={styles.imageBanner}
                            resizeMode="cover"
                            source={item}
                        />
                    </View>
                ))}
            </Swiper>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: width / 2.5, // Adjust this value to control banner height
        width: width,
        backgroundColor: "#000", // Optional: fallback color while images load
    },
    swiper: {
        height: width / 2.5, // Match container height
    },
    slide: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    imageBanner: {
        height: width / 2.5, // Match container height
        width: width,
    },
    pagination: {
        bottom: 10,
    },
    dot: {
        backgroundColor: "rgba(255,255,255,0.5)",
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: "#fff",
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 3,
    },
});

export default Banner;