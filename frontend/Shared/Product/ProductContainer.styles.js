import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const colors = {
  primary: "#4F3466",      // Deep purple - main brand color
  secondary: "#947CAC",    // Muted purple - secondary elements
  accent: "#A580A6",       // Dusty lavender - accents
  light: "#CABCD7",        // Soft lavender - backgrounds
  lighter: "#D2C9D4",      // Pale lavender - highlights
  white: "#FFFFFF",
  black: "#000000",
  text: "#333333",
  textLight: "#666666",
  border: "#E0E0E0",
  error: "#FF6B6B",
  success: "#4CAF50",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lighter,
  },
  surface: {
    flex: 1,
    backgroundColor: colors.lighter,
  },
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchbar: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 8,
    elevation: 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.lighter,
  },
  bannerContainer: {
    marginBottom: 8,
  },
  categoryContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  listContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: colors.lighter,
  },
  productCard: {
    width: width / 2 - 12,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.light,
  },
  productImage: {
    width: "100%",
    height: 150,
    backgroundColor: colors.light,
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.secondary,
  },
  productBrand: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  noProductsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.lighter,
  },
  noProductsText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.lighter,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.secondary,
  },
  categoryFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.light,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  searchedProductContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.lighter,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default {
  styles,
  colors,
};