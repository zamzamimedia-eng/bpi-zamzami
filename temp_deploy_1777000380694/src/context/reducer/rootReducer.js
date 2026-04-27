import chatPopupReducer, { chatPopupinitStates } from "./chatPopupReducer"
import chatReducer, { chatInitialStates } from "./chatReducer"
import emailReducer, { emailInitialStates } from "./emailReducer"
import layoutReducer, { layoutInitialStates } from "./layoutReducer"
import todoReducer, { todoInitialState } from "./todoReducer"
import tenantReducer, { tenantInitialState } from "./tenantReducer"


export const initialStates = {
    layoutState: layoutInitialStates,
    chatState: chatInitialStates,
    chatPopupState: chatPopupinitStates,
    emailState: emailInitialStates,
    todoState: todoInitialState,
    tenantState: tenantInitialState,
}

export const rootReducer = (state, action) => {
    return {
        layoutState: layoutReducer(state.layoutState, action),
        chatState: chatReducer(state.chatState, action),
        chatPopupState: chatPopupReducer(state.chatPopupState, action),
        emailState: emailReducer(state.emailState, action),
        todoState: todoReducer(state.todoState, action),
        tenantState: tenantReducer(state.tenantState, action),
    }
}