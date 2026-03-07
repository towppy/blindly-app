import React, { useCallback, useState } from "react";
import { View, FlatList } from "react-native";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from "@react-navigation/native";
import { getJwt } from "../../assets/common/jwtStore";
import OrderCard from "../../Shared/OrderCard";

const Orders = () => {
    const [orderList, setOrderList] = useState([]);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            getJwt()
                .then((res) => {
                    const token = res || "";
                    return axios.get(`${baseURL}orders`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                })
                .then((res) => {
                    if (isMounted) setOrderList(res.data || []);
                })
                .catch((error) => console.log(error));
            return () => {
                isMounted = false;
                setOrderList([]);
            };
        }, [])
    );

    return (
        <View>
            <FlatList
                data={orderList}
                renderItem={({ item }) => <OrderCard item={item} update={true} isAdmin={true} />}
                keyExtractor={(item) => String(item.id || item._id)}
            />
        </View>
    );
};

export default Orders;
