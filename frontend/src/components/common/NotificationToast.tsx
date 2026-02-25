import { useEffect } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { toast } from 'sonner'
import { useAppSelector } from '../../app/hooks'
import { selectCurrentUser } from '../../features/auth/authSlice'

export default function NotificationToast() {
    const user = useAppSelector(selectCurrentUser)

    useEffect(() => {
        if (!user) return

        let client: Client | null = null

        try {
            const socket = new SockJS('http://localhost:8080/ws')
            client = new Client({
                webSocketFactory: () => socket,
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            })

            client.onConnect = () => {
                console.log('🔗 WebSocket Connected')

                // Subscribe to Customer updates
                if (user.role === 'CUSTOMER') {
                    client?.subscribe(`/topic/customer/${user.id}/order-updates`, (message) => {
                        try {
                            const notification = JSON.parse(message.body)
                            toast.info(notification.message, {
                                description: `Đơn hàng #${notification.subOrderNumber} - ${notification.vendorName}`,
                                duration: 5000,
                            })
                        } catch (e) {
                            console.error('Error parsing notification:', e)
                        }
                    })
                }

                // Subscribe to Vendor updates
                if (user.role === 'VENDOR' && user.vendorId) {
                    client?.subscribe(`/topic/vendor/${user.vendorId}/orders`, (message) => {
                        try {
                            const notification = JSON.parse(message.body)
                            toast.success(notification.message, {
                                description: `Đơn mới #${notification.subOrderNumber} từ ${notification.customerName}`,
                                duration: 8000,
                                action: {
                                    label: 'Xem ngay',
                                    onClick: () => window.location.href = '/vendor/dashboard'
                                }
                            })
                        } catch (e) {
                            console.error('Error parsing notification:', e)
                        }
                    })
                }
            }

            client.onStompError = (frame) => {
                console.error('Broker reported error: ' + frame.headers['message'])
                console.error('Additional details: ' + frame.body)
            }

            client.activate()
        } catch (error) {
            console.error('WebSocket Initialization Error:', error)
        }

        return () => {
            if (client) {
                try {
                    client.deactivate()
                } catch (e) {
                    console.error('Error deactivating client:', e)
                }
            }
        }
    }, [user])

    return null
}
