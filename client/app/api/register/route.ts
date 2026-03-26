import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";


/* 
Because you created the folder api/register and exported the word POST, Next.js automatically created a live backend URL at http://localhost:3000/api/register.
Whenever your frontend later sends a POST request to that URL with an email and password, this function runs, encrypts the password, and officially drops them in your database!
 */
//Creates a User in the Database ,Next Auth cannot Create users out of the box
//This is for Registering a user and login is present in catch all route
export async function POST(req: Request) {

    try {

        const { email, password, username } = await req.json();

        // 2. Validate they actually typed something!
        if (!username || !email || !password) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const existingUser = await db.collection("users").findOne({ email });

        if (existingUser) {
            return NextResponse.json({ message: "User already exists with this email!" }, { status: 400 })
        }
        const hashPassword = await bcrypt.hash(password, 10);

        const newuser = await db.collection("users").insertOne({
            name: username,
            email: email,
            password: hashPassword,
            createdAt: new Date(),
        })

        return NextResponse.json({ message: "User registered successfully!" }, { status: 201 })



    } catch (error) {
        console.log("Error during Registration: ", error);
        return NextResponse.json({
            message: "An error An error occurred while registering the user",
        }, { status: 500 })
    }
}