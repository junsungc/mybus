import React, { useEffect, useState } from "react"

const { kakao } = window

const Map = () => {
    useEffect(() => {
        (async () => {
            const location = await getUserLocation();
            const container = document.getElementById("myMap")

            const options = {
                center: new kakao.maps.LatLng(location.latitude, location.longitude),
                level: 3,
            }
           new kakao.maps.Map(container, options)
        })();
    }, []);


    const getUserLocation = async () => {
        const getLocation = () => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            })
        }
        try {
            const result = await getLocation();
            const latitude = result.coords.latitude;   // 위도
            const longitude = result.coords.longitude; // 경도
            return { latitude, longitude }
        }
        catch (error) {
            return { latitude: '37.1634656', longitude: '127.1169024' } // 디폴트
        }
    }

    return (
        <div
            id="myMap"
            style={{
                position: "relative",
                top: "50px",
                left: "100px",
                width: "500px",
                height: "500px",
            }}>
        </div>
    )
}

export default Map