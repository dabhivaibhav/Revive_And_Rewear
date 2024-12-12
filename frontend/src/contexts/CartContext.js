import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const updateCart = useCallback(async () => {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) return;

        try {
            setIsLoading(true);
            const response = await axios.get(`http://localhost:8000/cart`, {
                params: { email: userEmail }
            });

            const items = Array.isArray(response.data) ? response.data : [];
            setCartItems(items);
        } catch (error) {
            console.error("Error fetching cart:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addToCart = async (product) => {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            alert("Please log in to add items to your cart.");
            return false;
        }

        try {
            setIsLoading(true);

            // Check if product is already in cart
            const isInCart = cartItems.some(item => item._id === product._id);
            if (isInCart) {
                alert("Product is already in your cart!");
                return false;
            }

            const payload = {
                email: userEmail,
                products: [{
                    productId: product._id,
                    quantity: 1
                }],
                buyed: false
            };

            // Changed the endpoint to match your backend route
            const response = await axios.post("http://localhost:8000/cart/add", payload);
            
            if (response.data && response.data.message) {
                await updateCart();
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error adding product to cart:", error?.response?.data || error);
            const errorMessage = error.response?.data?.detail || "Failed to add product to cart.";
            alert(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromCart = async (productId) => {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) return false;

        try {
            setIsLoading(true);
            await axios.delete(`http://localhost:8000/cart/delete`, {
                data: {
                    email: userEmail,
                    productId: productId
                }
            });

            setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
            await updateCart();
            return true;
        } catch (error) {
            console.error("Error removing product:", error);
            alert(error.response?.data?.detail || "Failed to remove product from cart.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (productId, quantity) => {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) return false;

        try {
            setIsLoading(true);
            await axios.put(`http://localhost:8000/cart/update`, {
                email: userEmail,
                id: productId,
                quantity
            });
            await updateCart();
            return true;
        } catch (error) {
            console.error("Error updating quantity:", error);
            alert(error.response?.data?.detail || "Failed to update quantity.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            isLoading,
            updateCart,
            addToCart,
            removeFromCart,
            updateQuantity
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);