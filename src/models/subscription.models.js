import mongoose, { Schema } from "mongoose";
import { User } from "./user.models.js";
const subscriptionSchema = new Schema(
    {
        subscriber: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }],
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }, { timestamps: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema)
