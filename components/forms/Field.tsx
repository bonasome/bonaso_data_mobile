import theme from '@/themes/themes';
import { Controller } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import Checkbox from '../inputs/Checkbox';
import DatePicker from '../inputs/DatePicker';
import Input from '../inputs/Input';
import MultiCheckbox from '../inputs/MultiCheckbox';
import MultiCheckboxNum from '../inputs/MultiCheckboxNum';
import RadioButtons from '../inputs/RadioButtons';
import SimplePicker from '../inputs/SimplePicker';
import StyledText from '../styledText';
//a singular field/question in a form. can support many different data types
export default function Field({ field, control }) {
  const { type, name, rules, label, options, placeholder } = field;
    //IndexComponent is the model select component, label/valueField are used to when providing maps (if not names label/valuve)
    //include/exclude params for filtering model index components
  return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: controllerField, fieldState }) => {
                const commonProps = {
                    ...controllerField,
                    label,
                    error: fieldState.error ? fieldState.error.message : null,
                };

                switch (type) {
                

                case "email-address":
                case 'phone-pad':
                case "number":
                case "text":
                    return <Input {...commonProps} placeholder={placeholder} />
                case 'date':
                    return <DatePicker {...commonProps} />  
                case 'select': //single select, radio is preferred unless the options are many
                    return <SimplePicker options={options} {...commonProps} />;
                
                case "radio": //single select from list
                    return <RadioButtons options={options} {...commonProps} />;
                case "checkbox": //toggle for true/false or switchpaths
                    return <Checkbox  {...commonProps} />;
                case 'multiselect': //multiselect from checkbox
                    return <MultiCheckbox {...commonProps} options={options} />
                case 'multinumber': //multiselect from checkbox
                    return <MultiCheckboxNum {...commonProps} options={options} />
                    
                default:
                    return <StyledText>Unsupported field type: {type}</StyledText>;
                }
            }}
        />
    );
}
const styles= StyleSheet.create({
    input: {
        padding: 15,
        backgroundColor: '#fff',
    },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
});