import { StyleSheet, Dimensions } from "react-native";

var { height, width } = Dimensions.get("window");

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    listContainer: {
        height: height,
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        flexWrap: "wrap",
        backgroundColor: "gainsboro",
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
    },
});

const ProductContainer = {
  styles,
};

export default ProductContainer;