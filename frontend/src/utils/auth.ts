export const isStudentLoggedIn = () : boolean => {
    const user = localStorage.getItem("user")
    return !!user
}