import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleOrderConfirmationNotification(orderId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Order Placed Successfully",
        body: `Your order ${orderId} has been received. We'll notify you when it's dispatched.`,
        data: { orderId, type: "order_confirmation" },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
    });
  } catch {}
}

export async function scheduleOrderStatusNotification(
  orderId: string,
  status: string
): Promise<void> {
  if (Platform.OS === "web") return;
  const statusMessages: Record<string, string> = {
    verified: `Payment for order ${orderId} has been verified!`,
    dispatched: `Great news! Order ${orderId} has been dispatched.`,
    delivered: `Order ${orderId} has been delivered. Enjoy!`,
    cancelled: `Order ${orderId} has been cancelled.`,
  };
  const body = statusMessages[status];
  if (!body) return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Almera Order Update",
        body,
        data: { orderId, type: "order_status", status },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
    });
  } catch {}
}
